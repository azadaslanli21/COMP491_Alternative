from django.db import models

class User(models.Model):
    id= models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    wage = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name


class WorkPackage(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.IntegerField()
    end_date = models.IntegerField()
    status = models.CharField(
        max_length=7,
        choices=STATUS_CHOICES,
        default='active',
    )
    users = models.ManyToManyField(User, related_name='work_packages')

    def __str__(self):
        return self.name


class Task(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.IntegerField()
    end_date = models.IntegerField()
    status = models.CharField(
        max_length=7,
        choices=STATUS_CHOICES,
        default='active',
    )
    users = models.ManyToManyField(User, related_name='tasks')
    work_package = models.ForeignKey(WorkPackage, on_delete=models.CASCADE, related_name='tasks')

    def __str__(self):
        return self.name

    